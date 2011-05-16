using UnityEngine;
using UnityEditor;
using System.Collections;
using System.Reflection;

public class ResponseCurveEditor : EditorWindow
{
	internal class ResponseCurve
	{
		internal FieldInfo field;
		internal MonoBehaviour behaviour;
	}
	
	ResponseCurve[] m_ResponseCurves = new ResponseCurve[0];
	CurveEditor     m_ActiveCurveEditor;
	int             m_SelectedCurve;
	Vector2         m_ScrollPosition;
		
	[MenuItem ("GameObject/Edit Response Curves")]
	static void Edit ()
	{
		ResponseCurveEditor editor = new ResponseCurveEditor ();
		editor.m_ResponseCurves = GetCurvesFromSelection();
		
		editor.position = new Rect (editor.position.x, editor.position.y, 500, 400);
		editor.DisplayCurve(0);
		editor.Show();
	}

	static ResponseCurve[] GetCurvesFromSelection ()
	{
		ArrayList curves = new ArrayList();
		
		if (Selection.activeTransform == null)
			return new ResponseCurve[0];
			
		foreach (MonoBehaviour behaviour in Selection.activeTransform.GetComponents(typeof(MonoBehaviour)))
		{
			FieldInfo[] myFieldInfo = behaviour.GetType().GetFields(BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);
	        for(int i = 0; i < myFieldInfo.Length; i++)
	        {
	        	if (myFieldInfo[i].FieldType == typeof(AnimationCurve))
	        	{
	        		object curve = myFieldInfo[i].GetValue(behaviour);
	        		if (curve != null)
	        		{
	        			ResponseCurve r = new ResponseCurve ();
	        			r.field = myFieldInfo[i];
	        			r.behaviour = behaviour;
		        		curves.Add(r);	
		        	}
	        	}
	        }
		}
		
		if (curves.Count != 0)
			return curves.ToArray(typeof(ResponseCurve)) as ResponseCurve[];
		else
			return new ResponseCurve[0];
	}
	
	
	void OnSelectionChange ()
	{
		ResponseCurve[]  curves = GetCurvesFromSelection ();
		m_ResponseCurves = curves;
		DisplayCurve(0);
		Repaint();
	}
	
	void OnEnable ()
	{
		OnSelectionChange ();
	}

	void DisplayCurve (int index)
	{
		if (index < m_ResponseCurves.Length)
		{
			object curve = m_ResponseCurves[index].field.GetValue(m_ResponseCurves[index].behaviour);
			if (curve != null)
			{
				m_SelectedCurve = index;
				if (m_ActiveCurveEditor == null)
					m_ActiveCurveEditor = new CurveEditor(position, curve as AnimationCurve);
				else
					m_ActiveCurveEditor.animationCurve = curve as AnimationCurve;
				return;
			}
		}
		m_SelectedCurve = -1;
		m_ActiveCurveEditor = null;
	}
		
	void OnGUI ()
	{
		Rect rect = new Rect (curveSelectionGridWidth, 0, Screen.width - curveSelectionGridWidth, Screen.height);
		
		CurveSelection ();
		if (m_ActiveCurveEditor != null)
			if ( m_ActiveCurveEditor.OnGUI(rect) )
				EditorUtility.SetDirty( m_ResponseCurves[ m_SelectedCurve ].behaviour );
	}
	
	float curveSelectionGridWidth = 100;
	
	void CurveSelection ()
	{
		if (m_ResponseCurves.Length == 0)
		{
			GUI.Label(new Rect (20, 20, Screen.width - 40, Screen.height), "No Response Curve in selection.\n\nPlease select a game object with scripts containing\npublicly exposed animation curves");
			return;
		}
	
		string[] curveNames = new string[m_ResponseCurves.Length];
		for (int i=0;i<m_ResponseCurves.Length;i++)
		{
			ResponseCurve curve = m_ResponseCurves[i];
			curveNames[i] = curve.field.Name;
		}
		
		m_ScrollPosition = GUILayout.BeginScrollView(m_ScrollPosition, GUILayout.Width(curveSelectionGridWidth), GUILayout.Height(Screen.height));
		GUI.changed = false;
		m_SelectedCurve = GUILayout.SelectionGrid(m_SelectedCurve, curveNames, 1, GUILayout.Width(curveSelectionGridWidth));
		GUILayout.EndScrollView();
		if (GUI.changed)
		{
			DisplayCurve(m_SelectedCurve);
		}
		
		Handles.color = Color.black;
		Handles.DrawLine(new Vector2 (curveSelectionGridWidth,0), new Vector2 (curveSelectionGridWidth,Screen.height));
		
	}
}